async function sendToAppsScript(url, payload){

    const response = await fetch(url, {

        method:'POST',

        body:JSON.stringify(payload),

        headers:{
            'Content-Type':'text/plain;charset=utf-8'
        },

        redirect:'follow'

    });

    const text = await response.text();

    let result;

    try{

        result = JSON.parse(text);

    }catch(err){

        console.error(text);

        throw new Error(
            "Response server tidak valid"
        );

    }

    if(result.status === "error"){

        throw new Error(result.message);

    }

    return result;

}