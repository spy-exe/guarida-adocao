package br.com.ricardofigueiredo.guarida.comum.excecao;

/** Choque com algo que ja existe, como um e-mail ja cadastrado. */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
