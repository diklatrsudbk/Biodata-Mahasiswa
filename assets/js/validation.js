function validateAge(dateValue){

    if(!dateValue) return true;

    const birthDate = new Date(dateValue);

    const today = new Date();

    if(birthDate > today){

        alert("Tanggal lahir tidak boleh lebih dari hari ini!");

        return false;

    }

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();

    if(
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ){
        age--;
    }

    if(age < 14){

        alert("Usia minimal 14 tahun!");

        return false;

    }

    return true;

}