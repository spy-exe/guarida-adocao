package br.com.ricardofigueiredo.guarida.animal;

public enum Porte {

    PEQUENO("Pequeno", 0, 10_000),
    MEDIO("Médio", 10_001, 25_000),
    GRANDE("Grande", 25_001, Integer.MAX_VALUE);

    private final String rotulo;
    private final int pesoMinimoEmGramas;
    private final int pesoMaximoEmGramas;

    Porte(String rotulo, int pesoMinimoEmGramas, int pesoMaximoEmGramas) {
        this.rotulo = rotulo;
        this.pesoMinimoEmGramas = pesoMinimoEmGramas;
        this.pesoMaximoEmGramas = pesoMaximoEmGramas;
    }

    /**
     * Sugere o porte a partir do peso. Serve de conferencia no cadastro: nao
     * impede o abrigo de escolher outro, porque filhote de raca grande pesa
     * pouco e continua sendo de porte grande.
     */
    public static Porte sugeridoPara(int pesoEmGramas) {
        for (Porte porte : values()) {
            if (pesoEmGramas >= porte.pesoMinimoEmGramas && pesoEmGramas <= porte.pesoMaximoEmGramas) {
                return porte;
            }
        }
        return GRANDE;
    }

    public String getRotulo() {
        return rotulo;
    }
}
