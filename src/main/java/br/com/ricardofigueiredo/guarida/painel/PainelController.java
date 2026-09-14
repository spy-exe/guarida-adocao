package br.com.ricardofigueiredo.guarida.painel;

import br.com.ricardofigueiredo.guarida.animal.AnimalService;
import br.com.ricardofigueiredo.guarida.animal.AnimalSpecs;
import br.com.ricardofigueiredo.guarida.animal.Especie;
import br.com.ricardofigueiredo.guarida.animal.Porte;
import br.com.ricardofigueiredo.guarida.animal.Sexo;
import br.com.ricardofigueiredo.guarida.animal.StatusAnimal;
import br.com.ricardofigueiredo.guarida.animal.Temperamento;
import br.com.ricardofigueiredo.guarida.animal.dto.AnimalResponse;
import br.com.ricardofigueiredo.guarida.comum.PaginaResponse;
import br.com.ricardofigueiredo.guarida.foto.RespostasDeAnimal;
import br.com.ricardofigueiredo.guarida.painel.dto.AdocoesNoMes;
import br.com.ricardofigueiredo.guarida.painel.dto.FatiaDeEspecie;
import br.com.ricardofigueiredo.guarida.painel.dto.ResumoDoAbrigo;
import br.com.ricardofigueiredo.guarida.seguranca.AbrigoAutenticado;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * O que o abrigo ve quando entra. Diferente do catalogo publico, aqui aparecem
 * tambem os animais que sairam da vitrine.
 */
@RestController
@RequestMapping("/api/v1/painel")
@Tag(name = "Painel", description = "Visão do abrigo sobre o próprio acervo")
public class PainelController {

    private final AnimalService animalService;
    private final PainelService painelService;
    private final RespostasDeAnimal respostas;

    public PainelController(AnimalService animalService, PainelService painelService,
                            RespostasDeAnimal respostas) {
        this.animalService = animalService;
        this.painelService = painelService;
        this.respostas = respostas;
    }

    @GetMapping("/animais")
    @Operation(summary = "Lista os animais do abrigo, inclusive os que não estão na vitrine")
    public PaginaResponse<AnimalResponse> animais(
            @AuthenticationPrincipal AbrigoAutenticado autenticado,
            @RequestParam(required = false) Especie especie,
            @RequestParam(required = false) Porte porte,
            @RequestParam(required = false) Sexo sexo,
            @RequestParam(required = false) StatusAnimal status,
            @RequestParam(required = false) Temperamento temperamento,
            @RequestParam(required = false) String busca,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC)
            Pageable paginacao) {

        var filtro = new AnimalSpecs.Filtro(especie, porte, sexo, status, temperamento, null, null, busca);
        return respostas.pagina(animalService.listarDoAbrigo(autenticado.getAbrigo(), filtro, paginacao));
    }

    @GetMapping("/resumo")
    @Operation(summary = "Contagem por situação, fila de candidaturas e tempo médio até a adoção")
    public ResumoDoAbrigo resumo(@AuthenticationPrincipal AbrigoAutenticado autenticado) {
        return painelService.resumir(autenticado.getAbrigo());
    }

    @GetMapping("/especies")
    @Operation(summary = "Quantos animais de cada espécie o abrigo mantém")
    public List<FatiaDeEspecie> especies(@AuthenticationPrincipal AbrigoAutenticado autenticado) {
        return painelService.porEspecie(autenticado.getAbrigo());
    }

    @GetMapping("/adocoes-por-mes")
    @Operation(summary = "Quantas adoções foram concluídas a cada mês")
    public List<AdocoesNoMes> adocoesPorMes(@AuthenticationPrincipal AbrigoAutenticado autenticado,
                                            @RequestParam(defaultValue = "12") int meses) {
        return painelService.adocoesPorMes(autenticado.getAbrigo(), meses);
    }
}
