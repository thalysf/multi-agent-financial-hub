from pathlib import Path
import os
from typing import Protocol

from dotenv import load_dotenv
from groq import APIError, AsyncGroq


DEFAULT_GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
DEFAULT_GROQ_FALLBACK_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]


class MissingGroqApiKeyError(RuntimeError):
    pass


class LlmProvider(Protocol):
    async def generate(self, *, system_prompt: str, user_prompt: str) -> str:
        ...


class GroqLlmProvider:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        fallback_models: list[str] | None = None,
    ) -> None:
        load_dotenv(_project_env_path())
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or os.getenv("GROQ_MODEL", DEFAULT_GROQ_MODEL)
        self.fallback_models = fallback_models or _load_fallback_models()

        if not self.api_key:
            raise MissingGroqApiKeyError(
                "GROQ_API_KEY is required. Set it as an environment variable or in agents-python/.env."
            )

        self.client = AsyncGroq(api_key=self.api_key)

    async def generate(self, *, system_prompt: str, user_prompt: str) -> str:
        errors: list[str] = []
        for model in self._model_candidates():
            try:
                completion = await self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    model=model,
                    temperature=0.2,
                    max_completion_tokens=500,
                )

                content = completion.choices[0].message.content
                if not content:
                    raise RuntimeError(f"Groq model {model} returned an empty response.")

                return content.strip()
            except APIError as error:
                errors.append(f"{model}: {error.__class__.__name__}")

        raise RuntimeError(f"All Groq model attempts failed: {', '.join(errors)}")

    def _model_candidates(self) -> list[str]:
        candidates = [self.model, *self.fallback_models]
        return list(dict.fromkeys(model for model in candidates if model))


class StaticLlmProvider:
    def __init__(self, response_prefix: str = "Static LLM response") -> None:
        self.response_prefix = response_prefix

    async def generate(self, *, system_prompt: str, user_prompt: str) -> str:
        return f"{self.response_prefix}: {user_prompt[:160]}"


def _project_env_path() -> Path:
    return Path(__file__).resolve().parents[2] / ".env"


def _load_fallback_models() -> list[str]:
    configured_models = os.getenv("GROQ_FALLBACK_MODELS")
    if not configured_models:
        return DEFAULT_GROQ_FALLBACK_MODELS

    return [
        model.strip()
        for model in configured_models.split(",")
        if model.strip()
    ]
