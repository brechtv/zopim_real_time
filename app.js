var department_id;
var department_name;
var token;

init()

function init() {
    department_id = localStorage.getItem('department_id');
    department_name = localStorage.getItem('department_name');
    token = localStorage.getItem('token');
    $("#oauth_token").val(token)
    refresh_agents(token)
    refresh_chats(token)
    if(department_id) {
        refresh_agents_for_department(department_id, department_name, token)
        refresh_departments(token)
    } else {
        refresh_departments(token)
    }
    setInterval(function(){ refresh() }, 60000);

}

function refresh() {
    refresh_agents(token)
    refresh_agents_for_department(department_id, department_name, token)
}

function save_credentials() {
    token = $("#oauth_token").val()
    localStorage.setItem("token", token);
    $("#authenticate_toggle").click();
    refresh()
}

// agents
function refresh_agents(token) {

    $("#agents_away").html(`<i class="material-icons md-48">sync</i>`)
    $("#agents_online").html(`<i class="material-icons md-48">sync</i>`)
    $("#agents_invisible").html(`<i class="material-icons md-48">sync</i>`)
    $.ajax({
        url: "https://bvcors.herokuapp.com/https://rtm.zopim.com/stream/agents",
        headers: {"Authorization": "Bearer " + token}
    }).done(function(result) {
        $("#authenticate_toggle").text("Authenticated")
        $("#authenticate_toggle").css("background-color", "#4CAF50")
        $("#refresh").prop('disabled', false);
        var data = result.content.data
        $("#agents_away").text(data.agents_away)
        $("#agents_online").text(data.agents_online)
        $("#agents_invisible").text(data.agents_invisible)
        // $(".agent-ticker").removeClass("blur")
        var online_pct = (data.agents_online / (data.agents_online + data.agents_away) * 100).toFixed(0) + "%"
        $("#online_percentage").text(online_pct)
        $("#online_percentage_bar").css("width", online_pct)
        refresh_chats(token)
    })
    .fail(function(result) {
        $("#authenticate_toggle").text("Not Authenticated")
        $("#authenticate_toggle").css("background-color", "#F84066")
        $("#refresh").prop('disabled', true);
    })
}

// chats
function refresh_chats(token) {
    $("#incoming_chats").html(`<i class="material-icons md-48">sync</i>`)
    $("#assigned_chats").html(`<i class="material-icons md-48">sync</i>`)
    $("#active_chats").html(`<i class="material-icons md-48">sync</i>`)
    $.ajax({
        url: "https://bvcors.herokuapp.com/https://rtm.zopim.com/stream/chats",
        headers: {"Authorization": "Bearer " + token}
    }).done(function(result) {
        var data = result.content.data
        $("#incoming_chats").text(data.incoming_chats)
    	$("#assigned_chats").text(data.assigned_chats)
    	$("#active_chats").text(data.active_chats)

        // calculate capacity
        var agents = $("#agents_online").text()
        var chats = $("#active_chats").text()
        var calculated_capacity = (chats / (agents * 2) * 100).toFixed(0) + "%"
        console.log(calculated_capacity)
        $("#calculated_capacity").text(calculated_capacity)
        $("#calculated_capacity_bar").css("width", calculated_capacity)

        /// update last refreshed timestamp
        var date = new Date()
        $("#last_refreshed_value").text(date.toTimeString())
    });
}

// departments
function refresh_departments(token) {
    $.ajax({
        url: "https://bvcors.herokuapp.com/https://www.zopim.com/api/v2/departments",
        headers: {"Authorization": "Bearer " + token}
    }).done(function(result) {
        $("#department_dropdown_options").empty()
        $.each(result, function(i, v) {
            var department_name = v.name;
            var id = v.id;
            var department_option_html = `<li class="dropdown-item department-dropdown-item" id="` + id + `">` + department_name + `</li>`
            $("#department_dropdown_options").append(department_option_html)
        })
        $(".department-dropdown-item").click(function() {
            department_id = this.id
            department_name = this.innerText
            localStorage.setItem("department_id", this.id);
            localStorage.setItem("department_name", this.innerText);
            refresh_agents_for_department(department_id, department_name, token)
        })
    });
}

function refresh_agents_for_department(department_id, department_name, token) {
    $("#department_agents_online").html(`<i class="material-icons md-48">sync</i>`)
    $("#department_agents_invisible").html(`<i class="material-icons md-48">sync</i>`)
    $("#department_agents_away").html(`<i class="material-icons md-48">sync</i>`)
    $("#current_department").text(department_name)
    $.ajax({
        url: "https://bvcors.herokuapp.com/https://rtm.zopim.com/stream/agents?department_id=" + department_id,
        headers: {"Authorization": "Bearer " + token}
    }).done(function(result) {
        var data = result.content.data
        var online_pct = (data.agents_online / (data.agents_online + data.agents_away) * 100).toFixed(0) + "%"
        $("#department_agents_online").text(data.agents_online)
        $("#department_online_percentage").text(online_pct)
        $("#department_agents_away").text(data.agents_away)
        $("#department_agents_invisible").text(data.agents_invisible)
        // $(".department-ticker").removeClass("blur")
    });
}
