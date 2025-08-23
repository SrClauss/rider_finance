use axum::{Router, routing::{post, get, put, delete}};
use backend::services::assinatura::get_assinatura_by_usuario_handler;
use backend::services::auth::logout::logout_handler;
use backend::services::auth::login::login_handler;
use backend::services::auth::register::register_user_handler;
use backend::services::auth::reset_password_handler;
use backend::services::auth::request_password_reset::request_password_reset_handler;
use backend::services::captcha::generate_captcha_handler;
use backend::db;
use backend::services::configuracao;
use backend::services::webhook::webhook::routes;
use std::net::SocketAddr;



#[tokio::main]
async fn main() {
    use backend::services::dashboard::dashboard_stats_handler;
    use backend::services::transacao::{create_transacao_handler, get_transacao_handler, list_transacoes_handler, update_transacao_handler, delete_transacao_handler};
    use backend::services::meta::{list_metas_a_cumprir_handler, list_metas_cumpridas_handler, create_meta_handler, delete_meta_handler};
    use backend::services::categoria::{create_categoria_handler, get_categoria_handler, delete_categoria_handler};
    use backend::services::assinatura::{create_assinatura_handler, get_assinatura_handler, list_assinaturas_handler, delete_assinatura_handler, asaas_webhook_handler, criar_checkout_handler};
    use backend::services::configuracao::{checkout_info_handler, usuario_completo_handler};
    use backend::services::auth::validate_token::validate_token_handler;
    use backend::services::auth::get_me::get_me_handler;
    use backend::services::meta::metas_ativas_com_transacoes_handler;

    let app = Router::new()
    .route("/api/relatorio/transacoes", post(backend::services::transacao::relatorio_transacoes_handler))
    .route("/api/metas/ativas-com-transacoes", get(metas_ativas_com_transacoes_handler))
        .route("/api/register", post(register_user_handler))
    // .route("/api/register-pending", post(register_pending_user_handler))
        .route("/api/reset-password/{id}", post(reset_password_handler))
        .route("/api/request-password-reset", post(request_password_reset_handler))
        .route("/api/login", post(login_handler))
        .route("/api/logout", post(logout_handler))
        .route("/api/validate_token", get(validate_token_handler))
        .route("/api/dashboard/stats", get(dashboard_stats_handler))
        .route("/api/transacao", post(create_transacao_handler))
        .route("/api/meta", post(create_meta_handler))
        .route("/api/meta/{id}", put(backend::services::meta::update_meta_handler))
        .route("/api/meta/{id}", delete(delete_meta_handler))
        .route("/api/transacao/{id}", get(get_transacao_handler))
        .route("/api/transacao/{id}", put(update_transacao_handler))
        .route("/api/transacao/{id}", delete(delete_transacao_handler))
        .route("/api/transacoes", post(list_transacoes_handler))
        .route("/api/captcha", get(generate_captcha_handler))
        .route("/api/meta/a_cumprir/{id_usuario}", get(list_metas_a_cumprir_handler))
        .route("/api/meta/a_cumprir", get(list_metas_a_cumprir_handler))
        .route("/api/meta/cumpridas/{id_usuario}", get(list_metas_cumpridas_handler))
        .route("/api/categoria", post(create_categoria_handler))
        .route("/api/categoria/{id}", get(get_categoria_handler))
    .route("/api/categoria/{id}", delete(delete_categoria_handler))
    // Atualizar configuração do usuário (tema, etc)
    .route("/api/configuracao/{id}", put(backend::services::configuracao::update_configuracao_axum))
    // rota removida: /api/categorias/{id_usuario}
        .route("/api/assinatura", post(create_assinatura_handler))
        .route("/api/assinatura/{id}", get(get_assinatura_handler))
    .route("/api/checkout-info", get(checkout_info_handler))
    .route("/api/usuario/{id}", get(usuario_completo_handler))
        .route("/api/assinatura/{id}", delete(delete_assinatura_handler))
        .route("/api/assinaturas/{id_usuario}", get(list_assinaturas_handler))
        .route("/api/assinatura/criar", post(backend::services::assinatura::criar_cliente_handler))
    .route("/api/assinatura/checkout", post(criar_checkout_handler))
        // .route("/api/usuario/{id}", get(get_usuario_info_handler)) // Removido pois não existe ou está no lugar errado
        .route("/api/webhook/asaas", post(asaas_webhook_handler))
        .route("/api/assinatura/byuserid/{id_usuario}", get(get_assinatura_by_usuario_handler))
        .route("/api/categorias", get(backend::services::categoria::list_categorias_autenticado_handler))
    .route("/api/me", get(get_me_handler))
        .merge(routes());
 
    // Seed automático de configurações iniciais no main
    let conn = &mut db::establish_connection();
    configuracao::seed_configuracoes_padrao(conn);

    // Executa o seed robusto para o usuário fixo
    //backend::services::seed::seed_movimentacao_robusta().await;
    println!("🚀 Servidor rodando em http://127.0.0.1:8000");

    use tokio::net::TcpListener;
    let listener = TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await.unwrap();
}
