package br.com.ricardofigueiredo.guarida.painel.dto;

/**
 * Os numeros que o abrigo olha primeiro. Somados pelo banco, e nao pela pagina
 * carregada na tela, senao mudariam conforme o tamanho da pagina.
 */
public record ResumoDoAbrigo(
        long disponiveis,
        long emProcesso,
        long adotados,
        long indisponiveis,
        long total,
        long candidaturasEmAberto,
        double mediaDeDiasAteAdocao) {
}
