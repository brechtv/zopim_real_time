var department_id;
var department_name;
var token;
var chats_historical = [];
var online_historical = [];

init()

function init() {
    department_id = localStorage.getItem('department_id');
    department_name = localStorage.getItem('department_name');
    token = localStorage.getItem('token');
    $("#oauth_token").val(token)
    refresh_agents(token)
    if (department_id) {
        refresh_agents_for_department(department_id, department_name, token)
        refresh_departments(token)
    } else {
        refresh_departments(token)
    }
    setInterval(function() {
        refresh()
    }, 60000);

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
            headers: {
                "Authorization": "Bearer " + token
            }
        }).done(function(result) {
            var date = new Date()
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

            if (online_historical.length > 60) {
                online_historical.push([[date.getHours(), date.getMinutes(), date.getSeconds()], data.agents_online])
            } else {
                online_historical.shift
                online_historical.push([[date.getHours(), date.getMinutes(), date.getSeconds()], data.agents_online])
            }
            if (online_historical) {
                draw_historical(online_historical, 'online_historical')
            }

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
        headers: {
            "Authorization": "Bearer " + token
        }
    }).done(function(result) {
        var data = result.content.data
        var date = new Date();
        if (chats_historical.length > 60) {
            chats_historical.push([[date.getHours(), date.getMinutes(), date.getSeconds()], data.active_chats])
        } else {
            chats_historical.shift
            chats_historical.push([[date.getHours(), date.getMinutes(), date.getSeconds()], data.active_chats])
        }
        if (chats_historical) {
            draw_historical(chats_historical, 'chats_historical')
        }

        $("#incoming_chats").text(data.incoming_chats)
        $("#assigned_chats").text(data.assigned_chats)
        $("#active_chats").text(data.active_chats)

        // calculate capacity
        var agents = $("#agents_online").text()
        var chats = $("#active_chats").text()
        var calculated_capacity = (chats / (agents * 2) * 100)
        if (calculated_capacity > 80) {
            $(".active-chats-card").addClass("buzz");
            setTimeout(function() {
                $(".active-chats-card").removeClass("buzz");
            }, 1000);
        } else {
            $(".active-chats-card").removeClass("buzz")
        }
        calculated_capacity = (chats / (agents * 2) * 100).toFixed(0) + "%"
        $("#calculated_capacity").text(calculated_capacity)
        $("#calculated_capacity_bar").css("width", calculated_capacity)

        /// update last refreshed timestamp
        $("#last_refreshed_value").text(date.toTimeString())
    });
}

// departments
function refresh_departments(token) {
    $.ajax({
        url: "https://bvcors.herokuapp.com/https://www.zopim.com/api/v2/departments",
        headers: {
            "Authorization": "Bearer " + token
        }
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
        headers: {
            "Authorization": "Bearer " + token
        }
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

function draw_historical(chats_array, target_container) {
    $("#" + target_container).empty()
    var data = new google.visualization.DataTable();
    data.addColumn('timeofday', 'Time');
    if(target_container == "chats_historical") {
        data.addColumn('number', 'Chats');
    } else {
        data.addColumn('number', 'Agents Online');
    }
    
    data.addRows(chats_array)
    var options = {
        height: 100,
        legend: {position: 'none'},
        hAxis: { title: '' },
        series: {
            0: { color: (target_container == "chats_historical" ? "#0092E5" : "#F84066") }
        }
      };

      var chart = new google.charts.Line(document.getElementById(target_container));

      chart.draw(data, google.charts.Line.convertOptions(options));
}