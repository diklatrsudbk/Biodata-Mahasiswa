function showToast(message,type='success'){

    const toast = document.createElement('div');

    toast.className = `
        fixed
        top-5
        right-5
        z-50
        px-5
        py-3
        rounded-xl
        text-white
        shadow-xl
        font-semibold
        transition
    `;

    if(type === 'error'){

        toast.classList.add('bg-red-500');

    }else{

        toast.classList.add('bg-green-600');

    }

    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.remove();

    },3000);

}