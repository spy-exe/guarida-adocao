package br.com.ricardofigueiredo.guarida.painel.dto;

import br.com.ricardofigueiredo.guarida.animal.Especie;

public record FatiaDeEspecie(Especie especie, String rotulo, long quantidade) {
}
