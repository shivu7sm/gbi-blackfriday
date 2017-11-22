/*global $ */

$(document).ready(function() {

    var table = $('#issueList').DataTable({ "iDisplayLength": 25 });
    var bugtable = $('#bugList').DataTable({ "iDisplayLength": 25 });

});

//href='https://watsonnodejs-shivu7sm.c9users.io/rest/update/<%= issue["key"] %>'

$(".comments").on("click", function(e) {

    var modal = $(".modal-body");
    modal.html('<i class="fa fa-spinner fa-spin" style="font-size: 88px; color: red;text-align: center;width: 100%;"></i>');
    var issuekey = $.trim($(this).parent().attr("value"));
    $(".modal-title").html(issuekey + ": Comments");
    var url = "https://watsonnodejs-shivu7sm.c9users.io/rest/update/" + issuekey + "?fields=comment&expand=renderedFields";
    var jiraurl = "https://jira.ecommerce.lenovo.com/browse/" + issuekey;
    console.log(url);
    $(".modalLink").attr("href", jiraurl);
    $.get(url, function(data, status, xhr) {
        var comm = data.renderedFields.comment.comments;
        if (comm.length === 0) {
            modal.html("<p class='h2'>No Comments Available Yet</p>");
        }
        else {
            modal.html("");
            var htmlContent = "";
            $.each(data.renderedFields.comment.comments, function(i, item) {
                htmlContent += "<div class='row'><div class='chatbox col col-md-10.5' style='background:white;padding:10px;margin: 15px 0px 15px 15px;'><h5 class='h5'>" + item.author.displayName + "</h5>";
                htmlContent += item.body + "</div> <div class='col col-md-1' style='padding:10px;margin: 15px 15px 15px 0px;background:white;'><img src='";
                htmlContent += item.author.avatarUrls["48x48"] + "'></div> </div>";
            });
            modal.append(htmlContent);
            $(".chatbox p").addClass('h6')
        }

    });
});

$(".status").on("click", function(e) {

    $.ajax({
        type: "POST",
        url: "https://api.omniture.com/admin/1.4/rest/?method=Report.Run",
        dataType: 'json',
        async: false,
        data: '{ "Username"="vpandian:Lenovo", PasswordDigest="bcP4UsMYkdj09EB6ZcWbAk0vugQ=","reportDescription": { "source": "realtime", "reportSuiteID": "lenovoglobal","metrics": [{"id": "revenue"}]}}',
        success: function() {
            alert('Thanks for your comment!');
        }
    });

    /*//alert("click triggered");
    var modal = $(".modal-body");
    modal.html('<i class="fa fa-spinner fa-spin" style="font-size: 88px; color: red;text-align: center;width: 100%;"></i>');
    var issuekey = $.trim($(this).parent().attr("value"));
    $(".modal-title").html(issuekey + ": High Level Solution");
    var url = "https://watsonnodejs-shivu7sm.c9users.io/rest/update/" + issuekey + "?fields=customfield_11000&expand=renderedFields";
    var jiraurl = "https://jira.ecommerce.lenovo.com/browse/" + issuekey;
    console.log(url);
    $(".modalLink").attr("href", jiraurl);
    $.get(url, function(data, status, xhr) {
        //console.log(data);
        var hlsstatus = data.renderedFields.customfield_11000;
        console.log(hlsstatus);
        if (hlsstatus == "") {
            modal.html("<p class='h2'>No Solution Available Yet</p>");
        }
        else {
            modal.html(data.renderedFields.customfield_11000);
        }

    });*/
});
