package br.com.ricardofigueiredo.guarida.foto;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.AnimalService;
import br.com.ricardofigueiredo.guarida.comum.excecao.RegraDeNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class FotoServiceTest {

    private final FotoRepository repositorio = mock(FotoRepository.class);
    private final FotoService servico = new FotoService(repositorio, mock(AnimalService.class));
    private final Abrigo abrigo = new Abrigo("Abrigo", "a@b.c", "hash", "Niterói", null);

    @Test
    @DisplayName("chamada sem conteudo nenhum e recusada antes de tocar o banco")
    void semConteudo() {
        assertThatThrownBy(() -> servico.enviar(abrigo, 1L, null, null, null, null))
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessage("Envie o arquivo da foto.");
        verifyNoInteractions(repositorio);
    }

    @Test
    @DisplayName("credito longo e cortado no limite da coluna, e branco vira ausente")
    void limpaCredito() {
        assertThat(FotoService.limpar("  Ana  ", 160)).isEqualTo("Ana");
        assertThat(FotoService.limpar("a".repeat(70), 60)).hasSize(60);
        assertThat(FotoService.limpar("   ", 60)).isNull();
        assertThat(FotoService.limpar(null, 60)).isNull();
    }

    @Test
    @DisplayName("a versao depende so dos bytes e tem dezesseis caracteres")
    void versaoEstavel() {
        assertThat(FotoService.versaoDe(new byte[]{1, 2, 3}))
                .hasSize(16)
                .isEqualTo(FotoService.versaoDe(new byte[]{1, 2, 3}))
                .isNotEqualTo(FotoService.versaoDe(new byte[]{1, 2, 4}));
    }
}
