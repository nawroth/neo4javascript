/*
 * Copyright 2009 Network Engine for Objects in Lund AB [neotechnology.com] This
 * program is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version. This program is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 * General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * <http://www.gnu.org/licenses/>.
 */

// this script just tests the syntax when using Neo4js

function print( s )
{
	out.println( s )
}

print( 'starting' );

var njs = Neo4js.createService( 'target/neo-db-test' );

njs.transaction( function( neo, index )
{
	var refNode = neo.getReferenceNode();
	print("" + refNode);
	print(refNode instanceof Neo4js.Node);
	print(refNode instanceof Neo4js.Relationship);

	// properties
	refNode.$("lastName", "Andersson");
	print(refNode.$("lastName"));
	// properties, alternate syntax
	refNode.$.name( "Carl" );
	print( refNode.$.name() );
	// let's go builder style
	refNode.$.age(40).country("Sweden").city("Stockholm");
	
	print("all property keys and values");
	for (let[k, v] in Iterator(refNode.$))
	{
		print(k + " : " + v);
	}

	print("all property keys and values, different syntax");
	// TODO unnecessary?
	for (let[k, v] in refNode.$())
	{
		print(k + " : " + v);
	}
	
	print("all keys");
	for (var k in Iterator(refNode.$, true))
	{
		print (k);
	}
	
	print("node id");
	print(refNode.getId());
	
	print("create node");
	var newNode = neo.createNode();
	print("" + newNode);
	print(newNode.getUnderlying());
	
	print("get node by id");
	var id = newNode.getId();
	print(neo.getNodeById(id));
	
	// create relationship
	var rel = refNode.createRelationshipTo(newNode, "myType");
	print("" + rel);
	print(rel instanceof Neo4js.Node);
	print(rel instanceof Neo4js.Relationship);
	print("relationship id");
	print(rel.getId());
	
	// create relationship, different syntax
	newNode._.to(refNode, "mySecondType");
	
	// fetch relationships
	
	print("all relationships");
	for (var r in Iterator(refNode._))
	{
		print(r + " : " + r.getType());
	}
	
	print("all relationships, different syntax");
	for (var r in refNode._())
	{
		print(r + " : " + r.getType());
	}

	print("typed relationships");
	for (var r in refNode._("mySecondType"))
	{
		print(r + " : " + r.getType());
	}
	
	print("outgoing relationships");
	for (var r in refNode._.outgoing)
	{
		print(r + " : " + r.getType());
	}

	print("outgoing relationships (different syntax)");
	for (var r in refNode._.outgoing())
	{
		print(r + " : " + r.getType());
	}

	print("typed outgoing relationships");
	for (var r in refNode._.outgoing("myType"))
	{
		print(r + " : " + r.getType());
	}

	print("typed outgoing relationships (should be empty)");
	for (var r in refNode._.outgoing("mySecondType"))
	{
		print(r + " : " + r.getType());
	}
	print("incoming relationships");
	for (var r in refNode._.incoming)
	{
		print(r + " : " + r.getType());
	}

	print("incoming relationships (different syntax)");
	for (var r in refNode._.incoming())
	{
		print(r + " : " + r.getType());
	}

	print("typed incoming relationships (should be empty)");
	for (var r in refNode._.incoming("myType"))
	{
		print(r + " : " + r.getType());
	}

	print("typed incoming relationships");
	for (var r in refNode._.incoming("mySecondType"))
	{
		print(r + " : " + r.getType());
	}
	
	print("traverse")
	
	var trav = refNode.traverse().undirected("myType");
	for (let[node, position] in Iterator(trav))
	{
		print((node instanceof Neo4js.Node) + " " + (position.returnedNodesCount));
	}

	print("only the nodes");
	for (node in Iterator(trav, true))
	{
		print(node.getId());
	}

	print("returnable evaluator");
	trav = refNode.traverse().incoming("mySecondType").returnNode(
		function(node, position){
			return position.notStartNode();
		});
	for (let[node, position] in Iterator(trav))
	{
		print((node instanceof Neo4js.Node) + " " + (node.getId()));
	}

	print("stop evaluator");
	trav = refNode.traverse().incoming("mySecondType").stopNode(
		function(node, position){
			return position.notStartNode();
		});
	for (let[node, position] in Iterator(trav))
	{
		print((node instanceof Neo4js.Node) + " " + (node.getId()));
	}
	
	print("traverse, give start node at start");
	trav = (new Neo4js.Traverser()).undirected("myType").returnAll();
    for (let[node, position] in Iterator(trav.start(refNode)))
    {
        print(node.getId());
    }
    print("(start from other node, reuse traverser)");
    for (let[node, position] in Iterator(trav.start(newNode)))
    {
        print(node.getId());
    }

	print("deleting new node");
	
	for (var r in newNode._())
	{
		r.del();
	}
	newNode.del();
	
	print("domain objects");
	var typeRepository = {};
	var myNodeWrapper = function ( typeRepository, spec)
	{
		var that = Neo4js.nodeWrapper( 
			typeRepository, {
			"type" : "myNodeWrapper",
			"node": spec.node,
			"properties": ["name"],
			"both": ["knows"]
		});
		that.myMethod = function ()
		{
			return "myMethod did this!";
		};
		return that;
	};
	
	typeRepository["myNodeWrapper"] = myNodeWrapper;
	
	var nodeToWrap = neo.createNode();
	var wrapped = myNodeWrapper({"node": nodeToWrap});
	wrapped.name("I'm the (wrapped) one");
	print("who? " + wrapped.name());
	
	var wrapped2 = myNodeWrapper({"node": neo.createNode()});
	wrapped2.name("I'm wrapped too");
	wrapped2.knows(wrapped);
	
//	print("wrapped knows:");
//	for (var friend in wrapped.knows())
//	{
//		print(friend);
//		print(friend.name());
//	}
} );

njs.shutdown();

print( 'finishing' );


function dumpObj(obj, name, indent, depth) {

       if (depth > 10) {
              return indent + name + ": <Maximum Depth Reached>\n";
       }

       if (typeof obj == "object") {
              var child = null;
              var output = indent + name + "\n";
              indent += "\t";
              for (var item in obj)
              {
                    try {
                           child = obj[item];
                    } catch (e) {
                           child = "<Unable to Evaluate>";
                    }
                    if (typeof child == "object") {
                           output += dumpObj(child, item, indent, depth + 1);
                    } else {
                           output += indent + item + ": " + child + "\n";
                    }
              }
              return output;
       } else {
              return obj;
       }
}