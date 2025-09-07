use diesel::AsChangeset;
// use diesel::AsChangeset; // não é necessário importar explicitamente
#[derive(Debug, Clone, AsChangeset)]
#[diesel(table_name = configuracoes)]
pub struct ConfiguracaoChangeset {
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: Option<bool>,
    pub atualizado_em: Option<chrono::NaiveDateTime>,
}
use diesel::Identifiable;
use crate::schema::configuracoes;
use diesel::{Insertable, Queryable};
use chrono::NaiveDateTime;
#[derive(Debug, Clone, Queryable, Identifiable, Insertable, serde::Serialize, serde::Deserialize, PartialEq)]
#[diesel(table_name = configuracoes)]
pub struct Configuracao {
    pub id: String,
    pub id_usuario: Option<String>,
    pub chave: String,
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable, Clone, serde::Serialize, serde::Deserialize)]
#[diesel(table_name = configuracoes)]
pub struct NewConfiguracao {
    pub id: String,
    pub id_usuario: Option<String>,
    pub chave: String,
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
