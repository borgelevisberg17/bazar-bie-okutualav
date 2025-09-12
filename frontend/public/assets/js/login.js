document.addEventListener("DOMContentLoaded", async() => {
    try {
        lucide.createIcons();
    } catch (e) {
        console.error("Erro ao carregar ícones Lucide:", e);
    }
    const response = await fetch("../database/users.json");
    const data = await response.json
    // --- Estado Centralizado (Para Persistência JSON) ---
    let usersData = data.users;

    // --- Função para Carregar Dados do JSON ---
    const loadUsersData = () => {
        try {
            const storedData = localStorage.getItem("usersData");
            if (storedData) {
                usersData = storedData;
            } else {
               
                saveUsersData(); // Salva os dados iniciais
            }
        } catch (error) {
            console.error("Erro ao carregar dados de usuários:", error);
            usersData = data.users; // Fallback
        }
    };

    // --- Função para Salvar Dados no JSON (Persistência Simulada) ---
    const saveUsersData = () => {
        try {
            localStorage.setItem("usersData", JSON.stringify(usersData));
        } catch (error) {
            console.error("Erro ao salvar dados de usuários:", error);
        }
    };

    // --- Cache de DOM Elements ---
    const dom = {
        loginForm: document.querySelector("login-form"),
        registerForm: document.querySelector("register-form"),
        showRegister: document.getElementById("showRegister"),
        showLogin: document.getElementById("showLogin"),
        loginEmail: document.getElementById("loginEmail"),
        loginPassword: document.getElementById("loginPassword"),
        loginEmailError: document.getElementById("loginEmailError"),
        loginPasswordError: document.getElementById("loginPasswordError"),
        registerName: document.getElementById("registerName"),
        registerEmail: document.getElementById("registerEmail"),
        registerPassword: document.getElementById("registerPassword"),
        confirmPassword: document.getElementById("confirmPassword"),
        terms: document.getElementById("terms"),
        registerNameError: document.getElementById("registerNameError"),
        registerEmailError: document.getElementById("registerEmailError"),
        registerPasswordError: document.getElementById("registerPasswordError"),
        confirmPasswordError: document.getElementById("confirmPasswordError"),
        termsError: document.getElementById("termsError"),
        toast: document.getElementById("toastNotification"),
        themeToggle: document.getElementById("themeToggle"),
        passwordInput: document.getElementById("registerPassword"),
        strengthContainer: document.getElementById("passwordStrength"),
        strengthBars: document.querySelectorAll(".strength-bar"),
        strengthText: document.querySelector(".strength-text")
    };

    // --- Funções Auxiliares ---
    const showToast = (message, type = "success") => {
        if (!dom.toast) return;
        dom.toast.textContent = message;
        dom.toast.className = `toast show ${type}`;
        setTimeout(() => dom.toast.classList.remove("show"), 3000);
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => password.length >= 8;
    const validateName = (name) => name.trim().length >= 2;

    const togglePasswordVisibility = (btn) => {
        const input = btn.previousElementSibling;
        const icon = btn.querySelector("i");
        input.type = input.type === "password" ? "text" : "password";
        icon.setAttribute("data-lucide", input.type === "password" ? "eye" : "eye-off");
        try {
            lucide.createIcons();
        } catch (e) {
            console.error("Erro ao atualizar ícones:", e);
        }
    };

    // --- Tema ---
    const applyTheme = (theme) => {
        document.body.classList.toggle("dark-theme", theme === "dark");
        const sunIcon = dom.themeToggle?.querySelector('[data-lucide="sun"]');
        const moonIcon = dom.themeToggle?.querySelector('[data-lucide="moon"]');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = theme === "dark" ? "none" : "block";
            moonIcon.style.display = theme === "dark" ? "block" : "none";
        }
    };

    // --- Redirecionar Usuários Logados ---
    if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "index.html";
    }

    // --- Inicializar Dados ---
    loadUsersData();

    // --- Tema Toggle ---
    if (dom.themeToggle) {
        dom.themeToggle.addEventListener("click", () => {
            const newTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
            localStorage.setItem("theme", newTheme);
            applyTheme(newTheme);
            showToast(`Tema ${newTheme === "dark" ? "escuro" : "claro"} ativado`, "info");
        });
        applyTheme(localStorage.getItem("theme") || "light");
    }

    // --- Form Toggle ---
    if (dom.showRegister && dom.showLogin) {
        dom.showRegister.addEventListener("click", (e) => {
            e.preventDefault();
            dom.loginForm?.classList.remove("active");
            dom.registerForm?.classList.add("active");
        });
        dom.showLogin.addEventListener("click", (e) => {
            e.preventDefault();
            dom.registerForm?.classList.remove("active");
            dom.loginForm?.classList.add("active");
        });
    }

    // --- Password Toggle ---
    document.querySelectorAll(".toggle-password").forEach((btn) => {
        btn.addEventListener("click", () => togglePasswordVisibility(btn));
    });

    // --- Password Strength Indicator ---
    if (dom.passwordInput && dom.strengthContainer) {
        dom.passwordInput.addEventListener("input", () => {
            const password = dom.passwordInput.value;
            let strength = 0;
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;

            dom.strengthBars.forEach((bar, index) => {
                bar.className = "strength-bar";
                if (index < strength) bar.classList.add("active");
            });

            if (strength === 0) {
                dom.strengthContainer.style.display = "none";
            } else {
                dom.strengthContainer.style.display = "flex";
                if (strength <= 2) {
                    dom.strengthText.textContent = "Fraca";
                    dom.strengthText.style.color = "var(--error-color)";
                } else if (strength === 3) {
                    dom.strengthText.textContent = "Média";
                    dom.strengthText.style.color = "#ffc107";
                } else {
                    dom.strengthText.textContent = "Forte";
                    dom.strengthText.style.color = "var(--success-color)";
                }
            }
        });
    }

    // --- Login Form Submission ---
    if (dom.loginForm) {
        dom.loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = dom.loginEmail?.value.trim() || "";
            const password = dom.loginPassword?.value || "";
            let isValid = true;

            dom.loginEmailError.textContent = "";
            dom.loginPasswordError.textContent = "";

            if (!validateEmail(email)) {
                dom.loginEmailError.textContent = "E-mail inválido";
                isValid = false;
            }
            if (!validatePassword(password)) {
                dom.loginPasswordError.textContent = "Senha deve ter pelo menos 8 caracteres";
                isValid = false;
            }

            if (isValid) {
                const user = usersData.users.find(u => u.email === email && u.password === password);
                if (user) {
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("currentUser", JSON.stringify({ name: user.name, avatar: user.avatar }));
                    showToast("Login bem-sucedido! Redirecionando...", "success");
                    setTimeout(() => window.location.href = "index.html", 1500);
                } else {
                    showToast("E-mail ou senha incorretos", "error");
                }
            }
        });
    }

    // --- Register Form Submission ---
    if (dom.registerForm) {
        dom.registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = dom.registerName?.value.trim() || "";
            const email = dom.registerEmail?.value.trim() || "";
            const password = dom.registerPassword?.value || "";
            const confirmPassword = dom.confirmPassword?.value || "";
            const terms = dom.terms?.checked || false;
            let isValid = true;

            dom.registerNameError.textContent = "";
            dom.registerEmailError.textContent = "";
            dom.registerPasswordError.textContent = "";
            dom.confirmPasswordError.textContent = "";
            dom.termsError.textContent = "";

            if (!validateName(name)) {
                dom.registerNameError.textContent = "Nome deve ter pelo menos 2 caracteres";
                isValid = false;
            }
            if (!validateEmail(email)) {
                dom.registerEmailError.textContent = "E-mail inválido";
                isValid = false;
            }
            if (!validatePassword(password)) {
                dom.registerPasswordError.textContent = "Senha deve ter pelo menos 8 caracteres";
                isValid = false;
            }
            if (password !== confirmPassword) {
                dom.confirmPasswordError.textContent = "As senhas não coincidem";
                isValid = false;
            }
            if (!terms) {
                dom.termsError.textContent = "Você deve aceitar os termos";
                isValid = false;
            }

            if (isValid) {
                if (usersData.users.find(u => u.email === email)) {
                    showToast("E-mail já cadastrado", "error");
                    return;
                }
                const newUser = {
                    id: usersData.users.length + 1,
                    name,
                    email,
                    password, // Em produção, hash com bcrypt
                    avatar: `../assets/randomUser/men1.jpg`
                };
                usersData.users.push(newUser);
                saveUsersData(); // Persistir em JSON
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("currentUser", JSON.stringify({ name: newUser.name, avatar: newUser.avatar }));
                showToast("Cadastro bem-sucedido! Redirecionando...", "success");
                setTimeout(() => window.location.href = "index.html", 1500);
            }
        });
    }

    // --- Placeholders ---
    document.querySelectorAll(".btn-social").forEach((btn) => {
        btn.addEventListener("click", () => showToast("Login social em desenvolvimento", "info"));
    });
    document.querySelector(".forgot-password")?.addEventListener("click", (e) => {
        e.preventDefault();
        showToast("Recuperação de senha em desenvolvimento", "info");
    });
    document.querySelectorAll(".terms-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showToast("Termos e políticas em desenvolvimento", "info");
        });
    });
});
