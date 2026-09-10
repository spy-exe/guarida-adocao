package br.com.ricardofigueiredo.guarida.animal.dto;

import br.com.ricardofigueiredo.guarida.animal.EventoDoAnimal;
import br.com.ricardofigueiredo.guarida.animal.TipoDeEvento;

import java.time.LocalDate;

public record EventoResponse(TipoDeEvento tipo, String tipoRotulo, String descricao, LocalDate acontecido) {

    public static EventoResponse de(EventoDoAnimal evento) {
        return new EventoResponse(evento.getTipo(), evento.getTipo().getRotulo(),
                evento.getDescricao(), evento.getAcontecido());
    }
}
