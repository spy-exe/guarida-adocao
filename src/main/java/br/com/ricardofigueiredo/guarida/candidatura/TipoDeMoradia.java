package br.com.ricardofigueiredo.guarida.candidatura;

public enum TipoDeMoradia {

    CASA("Casa"),
    APARTAMENTO("Apartamento"),
    SITIO("Sitio ou chacara");

    private final String rotulo;

    TipoDeMoradia(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
