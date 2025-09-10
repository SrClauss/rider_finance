use rand::Rng;

// Remove non-digit characters
pub fn cpf_digits_only(s: &str) -> String { s.chars().filter(|c| c.is_ascii_digit()).collect() }

pub fn validate_cpf_alg(cpf: &str) -> bool {
    let c = cpf_digits_only(cpf);
    if c.len() != 11 { return false; }
    // reject sequences
    if c.chars().all(|ch| ch == c.chars().next().unwrap()) { return false; }
    let nums: Vec<u32> = c.chars().map(|ch| ch.to_digit(10).unwrap()).collect();
    // primeiro dígito
    let mut sum = 0u32;
    for (i, &num) in nums.iter().enumerate().take(9) { sum += num * (10 - i as u32); }
    let mut d1 = 11 - (sum % 11);
    if d1 >= 10 { d1 = 0; }
    if d1 != nums[9] { return false; }
    // segundo
    let mut sum2 = 0u32;
    for (i, &num) in nums.iter().enumerate().take(10) { sum2 += num * (11 - i as u32); }
    let mut d2 = 11 - (sum2 % 11);
    if d2 >= 10 { d2 = 0; }
    if d2 != nums[10] { return false; }
    true
}

pub fn gerar_cpf_valido() -> String {
    let mut rng = rand::rng();
    let mut nums: Vec<u8> = (0..9).map(|_| rng.random_range(0..10) as u8).collect();
    // primeiro dígito verificador
    let mut sum = 0;
    for (i, &num) in nums.iter().enumerate().take(9) { sum += (num as i32) * (10 - i as i32); }
    let mut d1 = 11 - (sum % 11);
    if d1 >= 10 { d1 = 0; }
    nums.push(d1 as u8);
    // segundo dígito
    let mut sum2 = 0;
    for (i, &num) in nums.iter().enumerate().take(10) { sum2 += (num as i32) * (11 - i as i32); }
    let mut d2 = 11 - (sum2 % 11);
    if d2 >= 10 { d2 = 0; }
    let mut all = nums.clone();
    all.push(d2 as u8);
    all.into_iter().map(|d| d.to_string()).collect::<Vec<String>>().join("")
}
