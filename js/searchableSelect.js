function searchableSelect(options, selectedValue, callback){

    return {

        open:false,

        search:'',

        filtered:[...options],

        init(){

            this.search = selectedValue() || '';

            this.filterOptions(false);

            this.$watch(
                selectedValue,
                (value)=>{
                    this.search = value || '';
                    this.filterOptions(false);
                }
            );

        },

        filterOptions(show=true){

            this.open = show;

            this.filtered = options.filter(item =>
                item
                    .toLowerCase()
                    .includes(this.search.toLowerCase())
            );

        },

        select(item){

            this.search = item;

            callback(item);

            this.open = false;

        }

    }

}