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

Neo4js.util = {};
Neo4js.util.test = {};

Neo4js.util.test.cleanNodespace = function( service )
{
	service.transaction( function( neo )
	{
		var refNode = neo.getReferenceNode();
		var refId = refNode.getId();
		for ( var node in neo.getAllNodes() )
		{
			for ( var rel in node._() )
			{
				rel.del();
			}
			if ( node.getId() != refId )
			{
				node.del();
			}
		}
		for ( var key in Iterator( refNode.$, true ) )
		{
			refNode.removeProperty( key );
		}

	} );
};
