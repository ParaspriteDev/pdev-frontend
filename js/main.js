var githubAPI = "https://api.github.com/";

var fetchOrgRepos = function(org, callback) {
	jQuery.getJSON(githubAPI+"orgs/"+org+"/repos", callback);
}

var fetchCommits = function(org, repo, callback) {
	jQuery.getJSON(githubAPI+"repos/"+org+"/"+repo.name+"/commits", function(data) {
		callback(data, org, repo);
	});
}

var parseTimeAgo = function(stamp) {
	return new Date(stamp);
}

String.prototype.replaceData = function(repo, org) {
	return this.replace(/\%repo\%/g, repo).replace(/\%org\%/g, org);
}

var notNull = function(data) {
	return (data == null ? "None" : data);
}

var repoDataBuilder = function(repo, comm) {
	console.log(comm);
	var data = {
		"repo_title": "name",
		"repo_desc": "description",
		"repo_lang": "language",
		"r-star": "stargazers_count",
		"r-watch": "watchers_count",
		"r-fork": "forks_count"
	}
	for(var d in data) {
		var t = data[d];
		if(t in repo) {
			data[d] = notNull(repo[t]);
		}
	}
	var links = {
		"repo_title": "https://github.com/%org%/%repo%/",
		"b-watch": "https://github.com/%org%/%repo%/subscription",
		"r-watch": "https://github.com/%org%/%repo%/watchers",
		"b-star": "https://github.com/%org%/%repo%/stargazers",
		"r-star": "https://github.com/%org%/%repo%/stargazers",
		"b-fork": "https://github.com/%org%/%repo%#fork-destination-box",
		"r-fork": "https://github.com/%org%/%repo%/network"
	}
	for(var d in links) {
		var t = links[d];
		links[d] = t.replaceData(repo.name, repo.owner.login);
	}

	data["n-commit"] = comm.commit.message;
	data["t-commit"] = parseTimeAgo(comm.commit.committer.date);
	data["u-commit"] = comm.author.login;
	links["n-commit"] = comm.html_url;
	links["u-commit"] = comm.committer.html_url;

	return {"data": data, "links": links};
}

var repoDOMDump = function(element, data) {
	for(var d in data.data) {
		var point = data.data[d];
		element.find("."+d).text(point);
	}
	for(var l in data.links) {
		var point = data.links[l];
		element.find("."+l).attr("href", point);
	}
}

var repoDOMBuilder = function(data, tag) {
	var newInstance = $("#repo-template").clone()
					  .attr("id", data.data.repo_title)
					  .fadeIn("fast")
					  .appendTo(tag);
	repoDOMDump(newInstance, data);
}

jQuery.fn.buildRepoTree = function() {
	var target = $(this);
	var org = target.data("gitlist");
	fetchOrgRepos(org, function(data) {
		for(var repo in data) {
			fetchCommits(org, data[repo], function(e, d, r) {
				repoDOMBuilder(repoDataBuilder(r, e[0]), target);
			});
		}
		target.removeClass("not_rendered");
		target.addClass("rendered");
	});
}