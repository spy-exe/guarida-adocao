package br.com.ricardofigueiredo.guarida.animal;

public enum Especie {

    CACHORRO("Cachorro"),
    GATO("Gato"),
    COELHO("Coelho"),
    PASSARO("Pássaro"),
    OUTRO("Outro");

    private final String rotulo;

    Especie(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
