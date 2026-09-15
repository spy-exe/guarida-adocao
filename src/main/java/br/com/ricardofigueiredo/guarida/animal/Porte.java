package br.com.ricardofigueiredo.guarida.animal;

import java.util.Arrays;

public enum Porte {

    PEQUENO("Pequeno", 10_000),
    MEDIO("Médio", 25_000),
    GRANDE("Grande", Integer.MAX_VALUE);

    private final String rotulo;
    private final int pesoMaximoEmGramas;

    Porte(String rotulo, int pesoMaximoEmGramas) {
        this.rotulo = rotulo;
        this.pesoMaximoEmGramas = pesoMaximoEmGramas;
    }

    /**
     * Sugere o porte a partir do peso. Serve de conferencia no cadastro: nao
     * impede o abrigo de escolher outro, porque filhote de raca grande pesa
     * pouco e continua sendo de porte grande.
     */
    public static Porte sugeridoPara(int pesoEmGramas) {
        // as faixas estao em ordem crescente, entao vale a primeira cujo teto comporta o peso
        return Arrays.stream(values())
                .filter(porte -> pesoEmGramas <= porte.pesoMaximoEmGramas)
                .findFirst()
                .orElse(GRANDE);
    }

    public String getRotulo() {
        return rotulo;
    }
}
