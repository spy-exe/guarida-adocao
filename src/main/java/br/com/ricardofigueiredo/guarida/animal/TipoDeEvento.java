package br.com.ricardofigueiredo.guarida.animal;

public enum TipoDeEvento {

    ENTRADA("Entrada no abrigo"),
    VACINA("Vacina"),
    VERMIFUGO("Vermifugo"),
    CASTRACAO("Castracao"),
    CONSULTA("Consulta veterinaria"),
    ATUALIZACAO("Atualizacao do cadastro"),
    ADOCAO("Adocao concluida"),
    DEVOLUCAO("Devolucao ao abrigo");

    private final String rotulo;

    TipoDeEvento(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
