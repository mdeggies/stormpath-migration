const util = require('util');
const rp = require('request-promise').defaults({
    baseUrl: global.oktaBaseUrl,
    headers: global.oktaApiHeaders,
    json: true,
    simple: true,
    agentOptions: {
        keepAlive: false
    }
});

module.exports = function(name, description, callback) {
    var findExistingGroup = {
        url: '/api/v1/groups',
        qs: {
            q: name
        }
    };

    rp.get(findExistingGroup)
        .then(function (groups) {
            if (groups.length > 1) {
                callback(util.format('\tFound too many Okta Groups matching name=%s', name), null);
            } else if (groups.length === 1) {
                if (groups[0].profile.description !== description) {
                    updateExistingGroup(groups[0].id, name, description, callback);
                } else {
                    console.log('\tOkta Group \'%s\' already exists with id=%s', name, groups[0].id);
                    callback(null, groups[0].id);
                }
            } else {
                createNewGroup(name, description, callback);
            }
        })
        .catch(function (err) {
            console.error(err);
            callback(err, null);
        });
};

function createNewGroup(name, description, callback) {
    var groupData = {
        url: '/api/v1/groups',
        body: {
            'profile': {
                'name': name,
                'description': description
            }
        }
    };

    rp.post(groupData)
        .then(function (group) {
            console.log('\tCreated new Okta Group \'%s\' (id=%s)', name, group.id);
            callback(null, group.id);
        })
        .catch(function (err) {
            console.error('\tFailed to create Okta Group \'%s\': %s', name, err);
            callback(err, null);
        });
}

function updateExistingGroup(id, name, description, callback) {
    var groupData = {
        url: util.format('/api/v1/groups/%s', id),
        body: {
            'profile': {
                'name': name,
                'description': description
            }
        }
    };

    rp.put(groupData)
        .then(function (group) {
            console.log('\tUpdated Okta Group \'%s\' (id=%s)', name, id);
            callback(null, group.id);
        })
        .catch(function (err) {
            console.error('\tFailed to update Okta Group \'%s\' (id=%s): %s', name, id, err);
            callback(err, null);
        });
}