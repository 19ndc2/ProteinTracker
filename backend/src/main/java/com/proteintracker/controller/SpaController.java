package com.proteintracker.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    // Forward all non-API, non-static routes to index.html so Angular's
    // client-side router handles them on first load.
    @GetMapping(value = {
            "/",
            "/{path:^(?!api|assets|favicon\\.ico)[^.]*}",
            "/{path:^(?!api|assets|favicon\\.ico)[^.]*}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
