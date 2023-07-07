const backend_url = "http://localhost:5000"

const linkedin_url_auth = "https://www.linkedin.com/oauth/v2/authorization"
const client_id = "77tifxcif4y42k"
const redirect_uri = "http://127.0.0.1:5500/index.html"


const generateRandomString = (length) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const userAuthorization = async () => {
    try {
        if (!sessionStorage.getItem("state")) {
            const state = generateRandomString(16);
            sessionStorage.setItem('state', state);
            const scope = "r_liteprofile r_emailaddress w_member_social"
            const args = new URLSearchParams({
                response_type: 'code',
                client_id,
                redirect_uri,
                state,
                scope
            });
            window.location = linkedin_url_auth + "?" + args;
        }
        else {
            const urlParams = new URLSearchParams(window.location.search);
            const state = urlParams.get("state");
            if (state !== sessionStorage.getItem("state")) {
                //* CSRF attack protection
                sessionStorage.clear()
                userAuthorization()
            }
            else {
                const code = urlParams.get('code');
                sessionStorage.setItem('code', code);
            }
        }
        if (!sessionStorage.getItem("jwt") && sessionStorage.getItem("code")) {
            const body = {
                code: sessionStorage.getItem("code")
            };
            const response = await fetch(`${backend_url}/getaccesstoken`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })
            const jsonResponse = await response.json()
            if (!jsonResponse.success) {
                if (response.status < 500) {
                    sessionStorage.clear()
                    userAuthorization()
                }
                else {
                    console.log("Server Error! Please visit after some time")
                }
            }
            else {
                sessionStorage.setItem("jwt", jsonResponse.signedJwt)
                const showOnLogin = document.querySelectorAll(".showOnLogin");
                showOnLogin.forEach(doc => {
                    doc.removeAttribute("hidden");
                })
            }
        }
    } catch (error) {
        console.log(error)
    }
}

const logoutHandler = () => {
    sessionStorage.clear()
}

const apiCall = async (endpoint) => {
    try {
        const body = {
            token: sessionStorage.getItem("jwt")
        }
        const response = await fetch(`${backend_url}/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        const jsonResponse = await response.json()
        if(!jsonResponse.success) {
            return console.log(jsonResponse.error)
        }
        if(!jsonResponse.isTokenActive) {
            sessionStorage.clear()
            userAuthorization()
            getProfile()
        }
        else {
            console.log(jsonResponse.result)
        }
    } catch (error) {
        console.log(error)
    }
}

const getProfile = async () => {
    apiCall("getprofile")
}

const getEmail = () => {
    apiCall("getemail")
}

if (!sessionStorage.getItem("jwt")) {
    const showOnLogin = document.querySelectorAll(".showOnLogin");
    showOnLogin.forEach(doc => {
        doc.setAttribute("hidden", "hidden");
    })
}

userAuthorization()


