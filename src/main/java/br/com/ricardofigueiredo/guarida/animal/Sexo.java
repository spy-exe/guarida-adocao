package br.com.ricardofigueiredo.guarida.animal;

public enum Sexo {

    MACHO("Macho"),
    FEMEA("Femea");

    private final String rotulo;

    Sexo(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
