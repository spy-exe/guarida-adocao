package br.com.ricardofigueiredo.guarida.seguranca;

import br.com.ricardofigueiredo.guarida.abrigo.AbrigoRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DetalhesDoAbrigoService implements UserDetailsService {

    private final AbrigoRepository abrigoRepository;

    public DetalhesDoAbrigoService(AbrigoRepository abrigoRepository) {
        this.abrigoRepository = abrigoRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return abrigoRepository.findByEmail(email)
                .map(AbrigoAutenticado::new)
                .orElseThrow(() -> new UsernameNotFoundException("abrigo não encontrado"));
    }
}
