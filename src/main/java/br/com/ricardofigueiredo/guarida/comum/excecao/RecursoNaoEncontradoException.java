package br.com.ricardofigueiredo.guarida.comum.excecao;

/** O identificador pedido nao existe, ou nao pertence a quem perguntou. */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
