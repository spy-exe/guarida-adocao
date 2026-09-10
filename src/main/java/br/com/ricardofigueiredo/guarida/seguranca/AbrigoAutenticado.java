package br.com.ricardofigueiredo.guarida.seguranca;

import br.com.ricardofigueiredo.guarida.abrigo.Abrigo;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AbrigoAutenticado implements UserDetails {

    private final Abrigo abrigo;

    public AbrigoAutenticado(Abrigo abrigo) {
        this.abrigo = abrigo;
    }

    public Abrigo getAbrigo() {
        return abrigo;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return abrigo.getSenhaHash();
    }

    @Override
    public String getUsername() {
        return abrigo.getEmail();
    }
}
