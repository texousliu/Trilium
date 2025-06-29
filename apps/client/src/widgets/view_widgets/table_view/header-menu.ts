export function applyHeaderMenu(columns) {
    //apply header menu to each column
    for(let column of columns){
        column.headerMenu = headerMenu;
    }
}

function headerMenu(){
    var menu = [];
    var columns = this.getColumns();

    for(let column of columns){

        //create checkbox element using font awesome icons
        let icon = document.createElement("i");
        icon.classList.add("bx");
        icon.classList.add(column.isVisible() ? "bx-check" : "bx-empty");

        //build label
        let label = document.createElement("span");
        let title = document.createElement("span");

        title.textContent = " " + column.getDefinition().title;

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
            label:label,
            action:function(e){
                //prevent menu closing
                e.stopPropagation();

                //toggle current column visibility
                column.toggle();

                //change menu item icon
                if(column.isVisible()){
                    icon.classList.remove("bx-empty");
                    icon.classList.add("bx-check");
                }else{
                    icon.classList.remove("bx-check");
                    icon.classList.add("bx-empty");
                }
            }
        });
    }

   return menu;
};
