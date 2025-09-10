
use crate::models::{Transacao, categoria::Categoria};
use printpdf::*;
use std::collections::HashMap;
use diesel::prelude::*;
use crate::models::configuracao::Configuracao;

/// Busca todas as categorias do usuário e retorna um HashMap id -> nome
fn categorias_map(conn: &mut diesel::PgConnection, usuario_id: &str) -> HashMap<String, String> {
    use crate::schema::categorias::dsl::*;
    let results: Vec<Categoria> = categorias
    .filter(id_usuario.eq(usuario_id))
        .load(conn)
        .unwrap_or_default();
    results.into_iter().map(|c| (c.id, c.nome)).collect()
}

/// Busca a configuração de máscara de data do usuário (ou padrão)
fn buscar_mask_data(conn: &mut diesel::PgConnection, usuario_id: &str) -> String {
    use crate::schema::configuracoes::dsl::*;
    configuracoes
        .filter(
            (id_usuario.eq(usuario_id).or(id_usuario.is_null()))
            .and(chave.eq("mask_data"))
        )
        .order(id_usuario.desc().nulls_last())
        .first::<Configuracao>(conn)
        .ok()
        .and_then(|c| c.valor)
        .unwrap_or_else(|| "%Y-%m-%d %H:%M:%S".to_string())
}

fn formatar_moeda(valor: i32) -> String {
    let abs = (valor.abs() as f64) / 100.0;
    let mut s = format!("{abs:.2}");
    let parts: Vec<&str> = s.split('.').collect();
    let int_part = parts[0];
    let dec_part = parts.get(1).unwrap_or(&"00");
    let int_chars: Vec<char> = int_part.chars().rev().collect();
    let mut formatted = String::new();
    for (i, c) in int_chars.iter().enumerate() {
        if i > 0 && i % 3 == 0 {
            formatted.push('.');
        }
        formatted.push(*c);
    }
    let int_final: String = formatted.chars().rev().collect();
    s = format!("R$ {int_final},{dec_part}");
    s
}

pub fn gerar_pdf(_transacoes: &[Transacao], usuario_id: &str, conn: &mut diesel::PgConnection) -> Vec<u8> {
    
    let _cat_map = categorias_map(conn, usuario_id);
    let _mask_data = buscar_mask_data(conn, usuario_id);
    let doc = PdfDocument::new("Relatório de Transações");

    let opts = PdfSaveOptions::default();
    let mut warnings: Vec<PdfWarnMsg> = Vec::new();
    doc.save(&opts, &mut warnings)
}

pub fn gerar_xlsx(transacoes: &[Transacao], usuario_id: &str, conn: &mut diesel::PgConnection) -> Vec<u8> {
    let cat_map = categorias_map(conn, usuario_id);
    let mask_data = buscar_mask_data(conn, usuario_id);
    let mut book = umya_spreadsheet::new_file();
    let sheet_name = "Sheet1";
    let sheet = book.get_sheet_by_name_mut(sheet_name).unwrap();
    // Cabeçalho
    sheet.get_cell_mut((1, 1)).set_value("Data");
    sheet.get_cell_mut((2, 1)).set_value("Descrição");
    sheet.get_cell_mut((3, 1)).set_value("Categoria");
    sheet.get_cell_mut((4, 1)).set_value("Valor");
    // Formatação do cabeçalho
    for col in 1..=4 {
        let mut style = umya_spreadsheet::Style::default();
        style.get_font_mut().set_bold(true);
        sheet.get_cell_mut((col, 1)).set_style(style.clone());
    }
    let mut total: i32 = 0;
    for (i, t) in transacoes.iter().enumerate() {
        let row = (i + 2) as u32;
        let nome_categoria = cat_map.get(&t.id_categoria).cloned().unwrap_or("-".to_string());
        let valor_fmt = formatar_moeda(t.valor);
    let valor_final = if t.tipo == "saida" { format!("-{valor_fmt}") } else { valor_fmt.clone() };
        let data_str = t.data.format(&mask_data).to_string();
        sheet.get_cell_mut((1, row)).set_value(data_str);
        sheet.get_cell_mut((2, row)).set_value(t.descricao.as_deref().unwrap_or(""));
        sheet.get_cell_mut((3, row)).set_value(&nome_categoria);
        sheet.get_cell_mut((4, row)).set_value(valor_final);
        total += if t.tipo == "saida" { -t.valor } else { t.valor };
    }
    // Linha de total
    let total_row = (transacoes.len() + 2) as u32;
    sheet.get_cell_mut((3, total_row)).set_value("Total");
    let mut style = umya_spreadsheet::Style::default();
    style.get_font_mut().set_bold(true);
    sheet.get_cell_mut((3, total_row)).set_style(style.clone());
    sheet.get_cell_mut((4, total_row)).set_value(formatar_moeda(total));
    sheet.get_cell_mut((4, total_row)).set_style(style);
    let mut buffer = Vec::new();
    umya_spreadsheet::writer::xlsx::write_writer(&book, &mut buffer).unwrap();
    buffer
}
