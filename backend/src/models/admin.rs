use crate::schema::admins;
use chrono::NaiveDateTime;
use serde::{Serialize, Deserialize};
use diesel::prelude::*;

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = admins)]
pub struct Admin {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = admins)]
pub struct NewAdmin {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

impl NewAdmin {
    pub fn new(username: String, password_hash: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewAdmin {
            id: ulid::Ulid::new().to_string(),
            username,
            password_hash,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
