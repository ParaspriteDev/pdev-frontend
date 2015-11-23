var githubAPI = "https://api.github.com/";

var fetchOrg = function(org, clause, callback) {
	jQuery.getJSON(githubAPI+"orgs/"+org+"/"+clause, callback);
}

var fetchUserdata = function(username, callback) {
	jQuery.getJSON(githubAPI+"users/"+username, callback);
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

var notNull = function(data, rep) {
	return (data == null ? rep : data);
}

var userDataBuilder = function(user) {
	var data = {
		"gh_username": "login",
		"gh_name": "name",
		"gh_location":"location",
		"gh_followers":"followers",
		"gh_following":"following",
		"gh_repositories": "public_repos"
	}
	for(var d in data) {
		var t = data[d];
		if(t in user) {
			data[d] = notNull(user[t], "Unknown");
		}
	}
	var links = {
		"gh_username": "https://github.com/%org%",
		"gh_followers":"https://github.com/%org%/followers",
		"gh_following":"https://github.com/%org%/following",
		"gh_repositories": "https://github.com/%org%"
	}
	for(var d in links) {
		var t = links[d];
		links[d] = t.replaceData("", user.login);
	}
	return {"data":data, "links":links, "imag": {"gh_avatar": user.avatar_url}}
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
			data[d] = notNull(repo[t], "None");
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

	return {"data": data, "links": links, "imag": null};
}


var dataDOMBuilder = function(data, tag, template, name) {
	var newInstance = $(template).clone()
					  .attr("id", name)
					  .fadeIn("fast")
					  .appendTo(tag);

	if(data["data"] != null) {
		for(var d in data.data) {
			var point = data.data[d];
			newInstance.find("."+d).text(point);
		}
	}

	if(data["links"] != null) {
		for(var l in data.links) {
			var point = data.links[l];
			newInstance.find("."+l).attr("href", point);
		}
	}

	if(data["imag"] != null) {
		for(var l in data.imag) {
			var point = data.imag[l];
			newInstance.find("."+l).attr("src", point);
		}
	}
}

jQuery.fn.buildRepoTree = function() {
	var target = $(this);
	var org = target.data("gitlist");
	fetchOrg(org, "repos", function(data) {
		for(var repo in data) {
			fetchCommits(org, data[repo], function(e, d, r) {
				dataDOMBuilder(repoDataBuilder(r, e[0]), target, "#repo-template", r.name);
			});
		}
		target.removeClass("not_rendered");
		target.addClass("rendered");
	});
}

jQuery.fn.buildUserTree = function() {
	var target = $(this);
	var org = target.data("gitlist");
	fetchOrg(org, "members", function(data) {
		for(var user in data) {
			fetchUserdata(data[user].login, function(data) {
				dataDOMBuilder(userDataBuilder(data), target, "#user-template", data.id);
			});
		}
		target.removeClass("not_rendered");
		target.addClass("rendered");
	});
}