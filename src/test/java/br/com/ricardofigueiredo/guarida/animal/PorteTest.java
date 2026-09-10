package br.com.ricardofigueiredo.guarida.animal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class PorteTest {

    @ParameterizedTest(name = "{0} g sugere porte {1}")
    @CsvSource({
            "500, PEQUENO",
            "9999, PEQUENO",
            "10000, PEQUENO",
            "10001, MEDIO",
            "25000, MEDIO",
            "25001, GRANDE",
            "80000, GRANDE"
    })
    @DisplayName("o porte sugerido acompanha as faixas de peso")
    void sugerePeloPeso(int gramas, Porte esperado) {
        assertThat(Porte.sugeridoPara(gramas)).isEqualTo(esperado);
    }

    @ParameterizedTest
    @CsvSource({"PEQUENO, Pequeno", "MEDIO, Medio", "GRANDE, Grande"})
    @DisplayName("cada porte tem um rotulo pronto para a tela")
    void temRotulo(Porte porte, String rotulo) {
        assertThat(porte.getRotulo()).isEqualTo(rotulo);
    }
}
