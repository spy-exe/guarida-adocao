package br.com.ricardofigueiredo.guarida.candidatura;

/**
 * RECEBIDA -> EM_ANALISE -> APROVADA | RECUSADA
 * Qualquer uma das tres primeiras pode virar CANCELADA, quando o interessado
 * desiste ou quando outra candidatura para o mesmo animal e aprovada.
 */
public enum StatusDaCandidatura {

    RECEBIDA("Recebida"),
    EM_ANALISE("Em análise"),
    APROVADA("Aprovada"),
    RECUSADA("Recusada"),
    CANCELADA("Cancelada");

    private final String rotulo;

    StatusDaCandidatura(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
