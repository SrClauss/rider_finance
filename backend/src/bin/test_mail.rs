use std::env;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let smtp_server = env::var("YAHOO_SMTP_SERVER").unwrap_or_else(|_| "smtp.mail.yahoo.com".to_string());
    let smtp_port = env::var("YAHOO_SMTP_PORT").unwrap_or_else(|_| "465".to_string());
    let smtp_port: u16 = smtp_port.parse().unwrap_or(465);
    let smtp_user = env::var("YAHOO_EMAIL").expect("YAHOO_EMAIL não definido");
    let smtp_pass = env::var("YAHOO_APP_PASSWORD").expect("YAHOO_APP_PASSWORD não definido");
    let email_from = smtp_user.clone();
    let email_to = smtp_user.clone();

    let corpo = "<html><body><p>Teste de envio</p></body></html>";

    let email_msg = Message::builder()
        .from(email_from.parse().unwrap())
        .to(email_to.parse().unwrap())
        .subject("Teste envio Rider Finance")
        .header(lettre::message::header::ContentType::TEXT_HTML)
        .body(corpo.to_string())
        .unwrap();

    let creds = Credentials::new(smtp_user.clone(), smtp_pass.clone());

    // Try implicit TLS first (smtps) using relay_builder? lettre 0.11 SmtpTransport::relay uses STARTTLS on port 587. For implicit TLS on 465, use SmtpTransport::relay() + .port(465) may not initiate implicit TLS. We'll try builder for tls.
    let mailer = SmtpTransport::relay(&smtp_server)
        .expect("relay failed")
        .port(smtp_port)
        .credentials(creds)
        .build();

    match mailer.send(&email_msg) {
        Ok(resp) => (),
        Err(e) => (),
    }
}
