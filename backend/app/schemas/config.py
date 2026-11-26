from pydantic import BaseModel, ConfigDict, Field

class ConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome_restaurante: str

class ConfigIn(BaseModel):
    nome_restaurante: str = Field(min_length=2, max_length=120)
