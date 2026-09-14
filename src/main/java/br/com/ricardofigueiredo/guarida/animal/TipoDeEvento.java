package br.com.ricardofigueiredo.guarida.animal;

public enum TipoDeEvento {

    ENTRADA("Entrada no abrigo"),
    VACINA("Vacina"),
    VERMIFUGO("Vermífugo"),
    CASTRACAO("Castração"),
    CONSULTA("Consulta veterinária"),
    ATUALIZACAO("Atualização do cadastro"),
    ADOCAO("Adoção concluída"),
    DEVOLUCAO("Devolução ao abrigo");

    private final String rotulo;

    TipoDeEvento(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
