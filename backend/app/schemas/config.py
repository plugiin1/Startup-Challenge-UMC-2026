from pydantic import BaseModel, ConfigDict, Field

class ConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nome_restaurante: str
    taxa_servico_percent: float

class ConfigIn(BaseModel):
    nome_restaurante: str = Field(min_length=2, max_length=120)
    taxa_servico_percent: float = Field(ge=0, le=100)
