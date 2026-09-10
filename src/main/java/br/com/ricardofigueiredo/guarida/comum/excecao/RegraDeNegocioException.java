package br.com.ricardofigueiredo.guarida.comum.excecao;

/**
 * Pedido bem formado, porem proibido pelas regras do abrigo. Exemplo: concluir
 * a adocao de um animal que ainda nao teve candidatura aprovada.
 */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
