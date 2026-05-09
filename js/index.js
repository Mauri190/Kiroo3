        document.addEventListener("DOMContentLoaded", function() {
            const currentPage = window.location.pathname.split("/").pop() || "index.html";
            const links = document.querySelectorAll(".nav-link-custom");
            if(links.length) {
                links.forEach(link => {
                    const href = link.getAttribute("href");
                    if(href === currentPage || (currentPage === "index.html" && href === "index.html") ||
                       (currentPage === "" && href === "index.html")) {
                        link.classList.add("active");
                    }
                });
            }
        });