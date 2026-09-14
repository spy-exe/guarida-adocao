package br.com.ricardofigueiredo.guarida.foto;

/** O que a listagem precisa saber da foto, sem carregar a imagem. */
public record CreditoDaFoto(Long animalId, String versao, String autor, String licenca, String fonte) {
}
