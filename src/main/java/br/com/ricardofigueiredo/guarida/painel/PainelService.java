package br.com.ricardofigueiredo.guarida.painel;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import br.com.ricardofigueiredo.guarida.animal.AnimalRepository;
import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.candidatura.CandidaturaRepository;
import br.com.ricardofigueiredo.guarida.candidatura.StatusDaCandidatura;
import br.com.ricardofigueiredo.guarida.painel.dto.AdocoesNoMes;
import br.com.ricardofigueiredo.guarida.painel.dto.FatiaDeEspecie;
import br.com.ricardofigueiredo.guarida.painel.dto.ResumoDoAbrigo;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Service
public class PainelService {

    private final AnimalRepository animalRepository;
    private final CandidaturaRepository candidaturaRepository;

    public PainelService(AnimalRepository animalRepository, CandidaturaRepository candidaturaRepository) {
        this.animalRepository = animalRepository;
        this.candidaturaRepository = candidaturaRepository;
    }

    @Transactional(readOnly = true)
    public ResumoDoAbrigo resumir(Abrigo abrigo) {
        Object[] linha = animalRepository.contarPorSituacao(abrigo);
        // o Hibernate embrulha a projecao de coluna unica em outro vetor
        Object[] colunas = linha.length == 1 && linha[0] instanceof Object[] interno ? interno : linha;

        long emAberto = candidaturaRepository.doAbrigo(abrigo, StatusDaCandidatura.RECEBIDA,
                PageRequest.of(0, 1)).getTotalElements()
                + candidaturaRepository.doAbrigo(abrigo, StatusDaCandidatura.EM_ANALISE,
                PageRequest.of(0, 1)).getTotalElements();

        Double media = animalRepository.mediaDeDiasAteAdocao(abrigo.getId());

        return new ResumoDoAbrigo(
                comoLongo(colunas[0]),
                comoLongo(colunas[1]),
                comoLongo(colunas[2]),
                comoLongo(colunas[3]),
                comoLongo(colunas[4]),
                emAberto,
                media == null ? 0.0 : Math.round(media * 10.0) / 10.0);
    }

    @Transactional(readOnly = true)
    public List<FatiaDeEspecie> porEspecie(Abrigo abrigo) {
        return animalRepository.contarPorEspecie(abrigo).stream()
                .map(linha -> {
                    Especie especie = (Especie) linha[0];
                    return new FatiaDeEspecie(especie, especie.getRotulo(), comoLongo(linha[1]));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdocoesNoMes> adocoesPorMes(Abrigo abrigo, int meses) {
        LocalDate desde = LocalDate.now().minusMonths(Math.min(Math.max(meses, 1), 36))
                .withDayOfMonth(1);

        return animalRepository.adocoesPorMes(abrigo.getId(), desde).stream()
                .map(linha -> new AdocoesNoMes(comoData(linha[0]), comoLongo(linha[1])))
                .toList();
    }

    private static long comoLongo(Object valor) {
        return valor == null ? 0L : ((Number) valor).longValue();
    }

    private static LocalDate comoData(Object valor) {
        if (valor instanceof LocalDate data) {
            return data;
        }
        if (valor instanceof Date data) {
            return data.toLocalDate();
        }
        return LocalDate.parse(String.valueOf(valor));
    }
}
