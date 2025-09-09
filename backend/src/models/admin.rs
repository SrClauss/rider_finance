use crate::schema::admins;
use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize};
use diesel::prelude::*;

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = admins)]
pub struct Admin {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = admins)]
pub struct NewAdmin {
    pub id: String,
    pub username: String,
    pub password_hash: String,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

impl NewAdmin {
    pub fn new(username: String, password_hash: String) -> Self {
        let now = chrono::Utc::now();
        NewAdmin {
            id: ulid::Ulid::new().to_string(),
            username,
            password_hash,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
