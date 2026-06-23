function handlePhotoUpload(file){

    return new Promise((resolve,reject)=>{

        const MAX_SIZE = 200 * 1024;

        if(file.size > MAX_SIZE){

            reject("Ukuran foto maksimal 200KB");

            return;

        }

        const reader = new FileReader();

        reader.onload = e => {

            resolve({
                preview:e.target.result,
                base64:e.target.result.split(',')[1]
            });

        };

        reader.readAsDataURL(file);

    });

}



function handlePdfUpload(files){

    return new Promise((resolve,reject)=>{

        const MAX_TOTAL = 2 * 1024 * 1024;

        let total = 0;

        const output = [];

        let loaded = 0;

        files.forEach(file=>{

            total += file.size;

        });

        if(total > MAX_TOTAL){

            reject("Total file maksimal 2MB");

            return;

        }

        files.forEach(file=>{

            if(file.type !== "application/pdf"){

                reject(
                    `${file.name} bukan PDF`
                );

                return;

            }

            const reader = new FileReader();

            reader.onload = e => {

                output.push({

                    name:file.name,

                    base64:e.target.result.split(',')[1]

                });

                loaded++;

                if(loaded === files.length){

                    resolve(output);

                }

            };

            reader.readAsDataURL(file);

        });

    });

}