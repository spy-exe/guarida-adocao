package br.com.ricardofigueiredo.guarida.animal.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class IdadeEmPalavrasTest {

    @ParameterizedTest(name = "{0} meses vira \"{1}\"")
    @CsvSource({
            "0,  recém-nascido",
            "1,  1 mês",
            "2,  2 meses",
            "11, 11 meses",
            "12, 1 ano",
            "13, 1 ano e 1 mês",
            "15, 1 ano e 3 meses",
            "24, 2 anos",
            "38, 3 anos e 2 meses"
    })
    @DisplayName("a idade sai em palavras, porque ficha de animal não e planilha")
    void escreveAIdade(int meses, String esperado) {
        assertThat(AnimalResponse.idadeEmPalavras(meses)).isEqualTo(esperado);
    }
}
