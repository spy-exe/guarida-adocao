package br.com.ricardofigueiredo.guarida.painel;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.AnimalRepository;
import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.candidatura.CandidaturaRepository;
import br.com.ricardofigueiredo.guarida.candidatura.StatusDaCandidatura;
import br.com.ricardofigueiredo.guarida.painel.dto.AdocoesNoMes;
import br.com.ricardofigueiredo.guarida.painel.dto.ResumoDoAbrigo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * O que o banco devolve em projecao nativa muda de driver para driver: H2 manda
 * LocalDate, o PostgreSQL manda java.sql.Date, e agregado vazio vem nulo. Os
 * testes de integracao so enxergam o H2, entao as outras formas ficam aqui.
 */
class PainelServiceTest {

    private final AnimalRepository animais = mock(AnimalRepository.class);
    private final CandidaturaRepository candidaturas = mock(CandidaturaRepository.class);
    private final PainelService servico = new PainelService(animais, candidaturas);
    private final Abrigo abrigo = new Abrigo("Abrigo", "a@b.c", "hash", "Niterói", null);

    @BeforeEach
    void preparar() {
        ReflectionTestUtils.setField(abrigo, "id", 9L);
        when(candidaturas.doAbrigo(eq(abrigo), eq(StatusDaCandidatura.RECEBIDA), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 2));
        when(candidaturas.doAbrigo(eq(abrigo), eq(StatusDaCandidatura.EM_ANALISE), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 1));
    }

    @Test
    @DisplayName("aceita a linha do resumo embrulhada ou nao, e trata contagem nula como zero")
    void resumoNasDuasFormas() {
        when(animais.contarPorSituacao(abrigo)).thenReturn(new Object[]{new Object[]{5L, 1, null, 0L, 6L}});
        when(animais.mediaDeDiasAteAdocao(9L)).thenReturn(null);

        ResumoDoAbrigo embrulhado = servico.resumir(abrigo);
        assertThat(embrulhado.disponiveis()).isEqualTo(5);
        assertThat(embrulhado.emProcesso()).isEqualTo(1);
        assertThat(embrulhado.adotados()).isZero();
        assertThat(embrulhado.candidaturasEmAberto()).isEqualTo(3);
        assertThat(embrulhado.mediaDeDiasAteAdocao()).isZero();

        when(animais.contarPorSituacao(abrigo)).thenReturn(new Object[]{2L, 0L, 3L, 1L, 6L});
        when(animais.mediaDeDiasAteAdocao(9L)).thenReturn(123.456);

        ResumoDoAbrigo direto = servico.resumir(abrigo);
        assertThat(direto.adotados()).isEqualTo(3);
        assertThat(direto.total()).isEqualTo(6);
        assertThat(direto.mediaDeDiasAteAdocao()).isEqualTo(123.5);
    }

    @Test
    @DisplayName("linha unica que nao e vetor nao e confundida com resumo embrulhado")
    void linhaUnicaSimples() {
        when(animais.contarPorSituacao(abrigo)).thenReturn(new Object[]{7L, 0L, 0L, 0L, 7L});
        assertThat(servico.resumir(abrigo).disponiveis()).isEqualTo(7);
    }

    @Test
    @DisplayName("fatia por especie leva o rotulo da propria especie")
    void porEspecie() {
        when(animais.contarPorEspecie(abrigo)).thenReturn(List.<Object[]>of(new Object[]{Especie.GATO, 4L}));
        assertThat(servico.porEspecie(abrigo))
                .singleElement()
                .satisfies(fatia -> {
                    assertThat(fatia.rotulo()).isEqualTo(Especie.GATO.getRotulo());
                    assertThat(fatia.quantidade()).isEqualTo(4);
                });
    }

    @Test
    @DisplayName("o mes chega como LocalDate, java.sql.Date ou texto e sai sempre como LocalDate")
    void mesEmQualquerFormato() {
        LocalDate agosto = LocalDate.of(2026, 8, 1);
        when(animais.adocoesPorMes(eq(9L), any())).thenReturn(List.of(
                new Object[]{agosto, 2L},
                new Object[]{Date.valueOf("2026-07-01"), 1},
                new Object[]{"2026-06-01", null}));

        assertThat(servico.adocoesPorMes(abrigo, 12)).containsExactly(
                new AdocoesNoMes(agosto, 2),
                new AdocoesNoMes(LocalDate.of(2026, 7, 1), 1),
                new AdocoesNoMes(LocalDate.of(2026, 6, 1), 0));
    }

    @Test
    @DisplayName("a janela de meses fica entre 1 e 36 e sempre comeca no dia primeiro")
    void janelaLimitada() {
        when(animais.adocoesPorMes(eq(9L), any())).thenReturn(List.of());
        LocalDate primeiroDoMes = LocalDate.now().withDayOfMonth(1);

        servico.adocoesPorMes(abrigo, 0);
        verify(animais).adocoesPorMes(9L, primeiroDoMes.minusMonths(1));

        servico.adocoesPorMes(abrigo, 500);
        verify(animais).adocoesPorMes(9L, LocalDate.now().minusMonths(36).withDayOfMonth(1));
    }
}
